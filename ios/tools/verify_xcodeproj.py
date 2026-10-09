#!/usr/bin/env python3
"""Sanity-checks SwipePhotos.xcodeproj without Xcode: every object id referenced
exists, every file reference resolves to a real file on disk, and every Swift
file on disk is compiled."""
import json, os, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
raw = subprocess.check_output(["plutil", "-convert", "json", "-o", "-", os.path.join(ROOT, "SwipePhotos.xcodeproj/project.pbxproj")])
proj = json.loads(raw)
objs = proj["objects"]
errors = []

def need(oid, why):
    if oid not in objs:
        errors.append(f"missing object {oid} ({why})")
        return None
    return objs[oid]

root = need(proj["rootObject"], "rootObject")
main = need(root["mainGroup"], "mainGroup")

# Resolve every file reference to a path on disk.
paths = {}
def walk(gid, base):
    g = need(gid, "group")
    if not g: return
    here = os.path.join(base, g["path"]) if "path" in g else base
    for child in g.get("children", []):
        c = need(child, "child of " + g.get("path", g.get("name", "?")))
        if not c: continue
        if c["isa"] == "PBXGroup":
            walk(child, here)
        elif c["isa"] == "PBXFileReference":
            if c.get("sourceTree") == "BUILT_PRODUCTS_DIR":
                continue
            p = os.path.join(here, c["path"])
            paths[child] = p
            if not os.path.exists(os.path.join(ROOT, p)):
                errors.append(f"file not on disk: {p}")
walk(root["mainGroup"], "")

# Build phases
target = need(root["targets"][0], "target")
compiled, resourced = set(), set()
for phase_id in target["buildPhases"]:
    phase = need(phase_id, "phase")
    for bf_id in phase.get("files", []):
        bf = need(bf_id, "build file")
        if not bf: continue
        ref = bf["fileRef"]
        if ref not in paths: errors.append(f"build file {bf_id} refers to unknown fileRef {ref}")
        (compiled if phase["isa"] == "PBXSourcesBuildPhase" else resourced).add(paths.get(ref))

on_disk = set()
for dp, _, fs in os.walk(os.path.join(ROOT, "SwipePhotos")):
    for f in fs:
        if f.endswith(".swift"): on_disk.add(os.path.relpath(os.path.join(dp, f), ROOT))
missing = on_disk - compiled
extra = {c for c in compiled if c} - on_disk
for m in sorted(missing): errors.append(f"swift file on disk but not compiled: {m}")
for e in sorted(extra): errors.append(f"compiled file not on disk: {e}")

# Config lists
for cl in (root["buildConfigurationList"], target["buildConfigurationList"]):
    for cfg in need(cl, "config list")["buildConfigurations"]:
        need(cfg, "build configuration")
settings = objs[objs[target["buildConfigurationList"]]["buildConfigurations"][0]]["buildSettings"]
for key in ("INFOPLIST_FILE", "CODE_SIGN_ENTITLEMENTS", "PRODUCT_BUNDLE_IDENTIFIER"):
    if key not in settings: errors.append(f"target setting missing: {key}")
for key in ("INFOPLIST_FILE", "CODE_SIGN_ENTITLEMENTS"):
    if key in settings and not os.path.exists(os.path.join(ROOT, settings[key])):
        errors.append(f"{key} points at a missing file: {settings[key]}")

print(f"{len(compiled)} Swift files compiled, {len(resourced)} resources, {len(objs)} objects")
if errors:
    print("PROBLEMS:"); [print(" -", e) for e in errors]; sys.exit(1)
print("✓ project structure OK")
