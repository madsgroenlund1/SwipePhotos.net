#!/usr/bin/env python3
"""Generates ios/SwipePhotos.xcodeproj from the files on disk (no Xcode/XcodeGen needed).

Run from anywhere:  python3 ios/tools/gen_xcodeproj.py
Re-run whenever you add/remove Swift files. Alternative: `brew install xcodegen && xcodegen generate`
using ios/project.yml (equivalent output).
"""
import hashlib
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC_DIR = "SwipePhotos"
PROJECT = "SwipePhotos"
BUNDLE_ID = "net.swipephotos.app"
DEPLOYMENT_TARGET = "17.0"
MARKETING_VERSION = "1.0"
BUILD_NUMBER = "1"


def uid(*parts):
    return hashlib.md5("|".join(parts).encode()).hexdigest()[:24].upper()


def q(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


# ── scan disk ──────────────────────────────────────────────────────────────────
SOURCE_EXT = {".swift"}
RESOURCE_NAMES = {"Assets.xcassets"}
RESOURCE_EXT = {".xcprivacy"}
REFERENCE_ONLY_EXT = {".plist", ".entitlements", ".storekit"}

FILE_TYPES = {
    ".swift": "sourcecode.swift",
    ".plist": "text.plist.xml",
    ".entitlements": "text.plist.entitlements",
    ".xcprivacy": "text.xml",
    ".storekit": "text.json",
    ".xcassets": "folder.assetcatalog",
}


class Node:
    def __init__(self, name, path, is_dir):
        self.name, self.path, self.is_dir = name, path, is_dir
        self.children = []


def scan(rel):
    abs_dir = os.path.join(ROOT, rel)
    node = Node(os.path.basename(rel), rel, True)
    for entry in sorted(os.listdir(abs_dir)):
        if entry.startswith("."):
            continue
        child_rel = os.path.join(rel, entry)
        child_abs = os.path.join(ROOT, child_rel)
        if os.path.isdir(child_abs):
            if entry.endswith(".xcassets"):
                node.children.append(Node(entry, child_rel, False))  # treated as a single file
            else:
                node.children.append(scan(child_rel))
        else:
            node.children.append(Node(entry, child_rel, False))
    return node


tree = scan(SRC_DIR)

file_nodes = []


def collect(n):
    for c in n.children:
        if c.is_dir:
            collect(c)
        else:
            file_nodes.append(c)


collect(tree)

sources = [f for f in file_nodes if os.path.splitext(f.name)[1] in SOURCE_EXT]
resources = [
    f for f in file_nodes
    if f.name in RESOURCE_NAMES or os.path.splitext(f.name)[1] in RESOURCE_EXT
]

# ── ids ────────────────────────────────────────────────────────────────────────
PROJECT_ID = uid("project")
MAIN_GROUP = uid("group", "main")
PRODUCTS_GROUP = uid("group", "products")
APP_REF = uid("fileref", "app")
TARGET_ID = uid("target")
SOURCES_PHASE = uid("phase", "sources")
FRAMEWORKS_PHASE = uid("phase", "frameworks")
RESOURCES_PHASE = uid("phase", "resources")
PROJ_CFG_LIST = uid("cfglist", "project")
TARGET_CFG_LIST = uid("cfglist", "target")
PROJ_DEBUG = uid("cfg", "project", "debug")
PROJ_RELEASE = uid("cfg", "project", "release")
TGT_DEBUG = uid("cfg", "target", "debug")
TGT_RELEASE = uid("cfg", "target", "release")


def file_ref_id(path):
    return uid("fileref", path)


def group_id(path):
    return uid("group", path)


def build_id(path):
    return uid("build", path)


out = []
w = out.append

w("// !$*UTF8*$!")
w("{")
w("\tarchiveVersion = 1;")
w("\tclasses = {")
w("\t};")
w("\tobjectVersion = 56;")
w("\tobjects = {")
w("")

# PBXBuildFile
w("/* Begin PBXBuildFile section */")
for f in sources + resources:
    phase = "Sources" if f in sources else "Resources"
    w(f"\t\t{build_id(f.path)} /* {f.name} in {phase} */ = {{isa = PBXBuildFile; fileRef = {file_ref_id(f.path)} /* {f.name} */; }};")
w("/* End PBXBuildFile section */")
w("")

# PBXFileReference
w("/* Begin PBXFileReference section */")
w(f"\t\t{APP_REF} /* {PROJECT}.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = {PROJECT}.app; sourceTree = BUILT_PRODUCTS_DIR; }};")
for f in file_nodes:
    ext = os.path.splitext(f.name)[1]
    ftype = FILE_TYPES.get(ext, "text")
    w(f"\t\t{file_ref_id(f.path)} /* {f.name} */ = {{isa = PBXFileReference; lastKnownFileType = {ftype}; path = {q(f.name)}; sourceTree = \"<group>\"; }};")
w("/* End PBXFileReference section */")
w("")

# PBXFrameworksBuildPhase
w("/* Begin PBXFrameworksBuildPhase section */")
w(f"\t\t{FRAMEWORKS_PHASE} /* Frameworks */ = {{")
w("\t\t\tisa = PBXFrameworksBuildPhase;")
w("\t\t\tbuildActionMask = 2147483647;")
w("\t\t\tfiles = (")
w("\t\t\t);")
w("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
w("\t\t};")
w("/* End PBXFrameworksBuildPhase section */")
w("")


# PBXGroup
def emit_group(n, is_root=False):
    gid = group_id(n.path)
    w(f"\t\t{gid} /* {n.name} */ = {{")
    w("\t\t\tisa = PBXGroup;")
    w("\t\t\tchildren = (")
    # dirs first, then files
    for c in [c for c in n.children if c.is_dir] + [c for c in n.children if not c.is_dir]:
        cid = group_id(c.path) if c.is_dir else file_ref_id(c.path)
        w(f"\t\t\t\t{cid} /* {c.name} */,")
    w("\t\t\t);")
    w(f"\t\t\tpath = {q(n.name)};")
    w("\t\t\tsourceTree = \"<group>\";")
    w("\t\t};")
    for c in n.children:
        if c.is_dir:
            emit_group(c)


w("/* Begin PBXGroup section */")
w(f"\t\t{MAIN_GROUP} = {{")
w("\t\t\tisa = PBXGroup;")
w("\t\t\tchildren = (")
w(f"\t\t\t\t{group_id(tree.path)} /* {tree.name} */,")
w(f"\t\t\t\t{PRODUCTS_GROUP} /* Products */,")
w("\t\t\t);")
w("\t\t\tsourceTree = \"<group>\";")
w("\t\t};")
w(f"\t\t{PRODUCTS_GROUP} /* Products */ = {{")
w("\t\t\tisa = PBXGroup;")
w("\t\t\tchildren = (")
w(f"\t\t\t\t{APP_REF} /* {PROJECT}.app */,")
w("\t\t\t);")
w("\t\t\tname = Products;")
w("\t\t\tsourceTree = \"<group>\";")
w("\t\t};")
emit_group(tree)
w("/* End PBXGroup section */")
w("")

# PBXNativeTarget
w("/* Begin PBXNativeTarget section */")
w(f"\t\t{TARGET_ID} /* {PROJECT} */ = {{")
w("\t\t\tisa = PBXNativeTarget;")
w(f"\t\t\tbuildConfigurationList = {TARGET_CFG_LIST} /* Build configuration list for PBXNativeTarget \"{PROJECT}\" */;")
w("\t\t\tbuildPhases = (")
w(f"\t\t\t\t{SOURCES_PHASE} /* Sources */,")
w(f"\t\t\t\t{FRAMEWORKS_PHASE} /* Frameworks */,")
w(f"\t\t\t\t{RESOURCES_PHASE} /* Resources */,")
w("\t\t\t);")
w("\t\t\tbuildRules = (")
w("\t\t\t);")
w("\t\t\tdependencies = (")
w("\t\t\t);")
w(f"\t\t\tname = {PROJECT};")
w(f"\t\t\tproductName = {PROJECT};")
w(f"\t\t\tproductReference = {APP_REF} /* {PROJECT}.app */;")
w("\t\t\tproductType = \"com.apple.product-type.application\";")
w("\t\t};")
w("/* End PBXNativeTarget section */")
w("")

# PBXProject
w("/* Begin PBXProject section */")
w(f"\t\t{PROJECT_ID} /* Project object */ = {{")
w("\t\t\tisa = PBXProject;")
w("\t\t\tattributes = {")
w("\t\t\t\tBuildIndependentTargetsInParallel = 1;")
w("\t\t\t\tLastSwiftUpdateCheck = 1600;")
w("\t\t\t\tLastUpgradeCheck = 1600;")
w("\t\t\t\tTargetAttributes = {")
w(f"\t\t\t\t\t{TARGET_ID} = {{")
w("\t\t\t\t\t\tSystemCapabilities = {")
w("\t\t\t\t\t\t\tcom.apple.InAppPurchase = {")
w("\t\t\t\t\t\t\t\tenabled = 1;")
w("\t\t\t\t\t\t\t};")
w("\t\t\t\t\t\t\tcom.apple.SignInWithApple = {")
w("\t\t\t\t\t\t\t\tenabled = 1;")
w("\t\t\t\t\t\t\t};")
w("\t\t\t\t\t\t};")
w("\t\t\t\t\t};")
w("\t\t\t\t};")
w("\t\t\t};")
w(f"\t\t\tbuildConfigurationList = {PROJ_CFG_LIST} /* Build configuration list for PBXProject \"{PROJECT}\" */;")
w("\t\t\tcompatibilityVersion = \"Xcode 14.0\";")
w("\t\t\tdevelopmentRegion = en;")
w("\t\t\thasScannedForEncodings = 0;")
w("\t\t\tknownRegions = (")
w("\t\t\t\ten,")
w("\t\t\t\tBase,")
w("\t\t\t);")
w(f"\t\t\tmainGroup = {MAIN_GROUP};")
w(f"\t\t\tproductRefGroup = {PRODUCTS_GROUP} /* Products */;")
w("\t\t\tprojectDirPath = \"\";")
w("\t\t\tprojectRoot = \"\";")
w("\t\t\ttargets = (")
w(f"\t\t\t\t{TARGET_ID} /* {PROJECT} */,")
w("\t\t\t);")
w("\t\t};")
w("/* End PBXProject section */")
w("")

# PBXResourcesBuildPhase
w("/* Begin PBXResourcesBuildPhase section */")
w(f"\t\t{RESOURCES_PHASE} /* Resources */ = {{")
w("\t\t\tisa = PBXResourcesBuildPhase;")
w("\t\t\tbuildActionMask = 2147483647;")
w("\t\t\tfiles = (")
for f in resources:
    w(f"\t\t\t\t{build_id(f.path)} /* {f.name} in Resources */,")
w("\t\t\t);")
w("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
w("\t\t};")
w("/* End PBXResourcesBuildPhase section */")
w("")

# PBXSourcesBuildPhase
w("/* Begin PBXSourcesBuildPhase section */")
w(f"\t\t{SOURCES_PHASE} /* Sources */ = {{")
w("\t\t\tisa = PBXSourcesBuildPhase;")
w("\t\t\tbuildActionMask = 2147483647;")
w("\t\t\tfiles = (")
for f in sources:
    w(f"\t\t\t\t{build_id(f.path)} /* {f.name} in Sources */,")
w("\t\t\t);")
w("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
w("\t\t};")
w("/* End PBXSourcesBuildPhase section */")
w("")


# XCBuildConfiguration
def settings_block(d, indent="\t\t\t\t"):
    lines = []
    for k in sorted(d):
        v = d[k]
        if isinstance(v, list):
            lines.append(f"{indent}{k} = (")
            for item in v:
                lines.append(f"{indent}\t{q(item)},")
            lines.append(f"{indent});")
        else:
            sv = str(v)
            needs_q = not sv.replace("_", "").replace(".", "").isalnum() or sv == ""
            lines.append(f"{indent}{k} = {q(sv) if needs_q else sv};")
    return "\n".join(lines)


project_common = {
    "ALWAYS_SEARCH_USER_PATHS": "NO",
    "CLANG_ENABLE_MODULES": "YES",
    "CLANG_ENABLE_OBJC_ARC": "YES",
    "COPY_PHASE_STRIP": "NO",
    "ENABLE_STRICT_OBJC_MSGSEND": "YES",
    "IPHONEOS_DEPLOYMENT_TARGET": DEPLOYMENT_TARGET,
    "MTL_FAST_MATH": "YES",
    "SDKROOT": "iphoneos",
    "SWIFT_VERSION": "5.0",
}
project_debug = dict(project_common, **{
    "DEBUG_INFORMATION_FORMAT": "dwarf",
    "ENABLE_TESTABILITY": "YES",
    "GCC_OPTIMIZATION_LEVEL": "0",
    "GCC_PREPROCESSOR_DEFINITIONS": ["DEBUG=1", "$(inherited)"],
    "MTL_ENABLE_DEBUG_INFO": "INCLUDE_SOURCE",
    "ONLY_ACTIVE_ARCH": "YES",
    "SWIFT_ACTIVE_COMPILATION_CONDITIONS": "DEBUG",
    "SWIFT_OPTIMIZATION_LEVEL": "-Onone",
})
project_release = dict(project_common, **{
    "DEBUG_INFORMATION_FORMAT": "dwarf-with-dsym",
    "ENABLE_NS_ASSERTIONS": "NO",
    "MTL_ENABLE_DEBUG_INFO": "NO",
    "SWIFT_COMPILATION_MODE": "wholemodule",
    "SWIFT_OPTIMIZATION_LEVEL": "-O",
    "VALIDATE_PRODUCT": "YES",
})
target_common = {
    "ASSETCATALOG_COMPILER_APPICON_NAME": "AppIcon",
    "ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME": "AccentColor",
    "CODE_SIGN_ENTITLEMENTS": f"{SRC_DIR}/Resources/{PROJECT}.entitlements",
    "CODE_SIGN_STYLE": "Automatic",
    "CURRENT_PROJECT_VERSION": BUILD_NUMBER,
    "DEVELOPMENT_TEAM": "",
    "GENERATE_INFOPLIST_FILE": "NO",
    "INFOPLIST_FILE": f"{SRC_DIR}/Resources/Info.plist",
    "LD_RUNPATH_SEARCH_PATHS": ["$(inherited)", "@executable_path/Frameworks"],
    "MARKETING_VERSION": MARKETING_VERSION,
    "PRODUCT_BUNDLE_IDENTIFIER": BUNDLE_ID,
    "PRODUCT_NAME": "$(TARGET_NAME)",
    "SUPPORTED_PLATFORMS": "iphoneos iphonesimulator",
    "SUPPORTS_MACCATALYST": "NO",
    "SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD": "NO",
    "SWIFT_EMIT_LOC_STRINGS": "YES",
    "TARGETED_DEVICE_FAMILY": "1",
}

w("/* Begin XCBuildConfiguration section */")
for cid, name, d in [
    (PROJ_DEBUG, "Debug", project_debug),
    (PROJ_RELEASE, "Release", project_release),
]:
    w(f"\t\t{cid} /* {name} */ = {{")
    w("\t\t\tisa = XCBuildConfiguration;")
    w("\t\t\tbuildSettings = {")
    w(settings_block(d))
    w("\t\t\t};")
    w(f"\t\t\tname = {name};")
    w("\t\t};")
for cid, name in [(TGT_DEBUG, "Debug"), (TGT_RELEASE, "Release")]:
    w(f"\t\t{cid} /* {name} */ = {{")
    w("\t\t\tisa = XCBuildConfiguration;")
    w("\t\t\tbuildSettings = {")
    w(settings_block(target_common))
    w("\t\t\t};")
    w(f"\t\t\tname = {name};")
    w("\t\t};")
w("/* End XCBuildConfiguration section */")
w("")

w("/* Begin XCConfigurationList section */")
w(f"\t\t{PROJ_CFG_LIST} /* Build configuration list for PBXProject \"{PROJECT}\" */ = {{")
w("\t\t\tisa = XCConfigurationList;")
w("\t\t\tbuildConfigurations = (")
w(f"\t\t\t\t{PROJ_DEBUG} /* Debug */,")
w(f"\t\t\t\t{PROJ_RELEASE} /* Release */,")
w("\t\t\t);")
w("\t\t\tdefaultConfigurationIsVisible = 0;")
w("\t\t\tdefaultConfigurationName = Release;")
w("\t\t};")
w(f"\t\t{TARGET_CFG_LIST} /* Build configuration list for PBXNativeTarget \"{PROJECT}\" */ = {{")
w("\t\t\tisa = XCConfigurationList;")
w("\t\t\tbuildConfigurations = (")
w(f"\t\t\t\t{TGT_DEBUG} /* Debug */,")
w(f"\t\t\t\t{TGT_RELEASE} /* Release */,")
w("\t\t\t);")
w("\t\t\tdefaultConfigurationIsVisible = 0;")
w("\t\t\tdefaultConfigurationName = Release;")
w("\t\t};")
w("/* End XCConfigurationList section */")
w("\t};")
w(f"\trootObject = {PROJECT_ID} /* Project object */;")
w("}")

proj_dir = os.path.join(ROOT, f"{PROJECT}.xcodeproj")
os.makedirs(proj_dir, exist_ok=True)
with open(os.path.join(proj_dir, "project.pbxproj"), "w") as fh:
    fh.write("\n".join(out) + "\n")

# workspace data
ws_dir = os.path.join(proj_dir, "project.xcworkspace")
os.makedirs(ws_dir, exist_ok=True)
with open(os.path.join(ws_dir, "contents.xcworkspacedata"), "w") as fh:
    fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<Workspace\n   version = "1.0">\n   <FileRef\n      location = "self:">\n   </FileRef>\n</Workspace>\n')

# shared scheme (with StoreKit test configuration for the simulator)
scheme_dir = os.path.join(proj_dir, "xcshareddata", "xcschemes")
os.makedirs(scheme_dir, exist_ok=True)
storekit_rel = f"{SRC_DIR}/Resources/Products.storekit"
has_storekit = os.path.exists(os.path.join(ROOT, storekit_rel))
storekit_xml = (
    f'      <StoreKitConfigurationFileReference\n         identifier = "../../{storekit_rel}">\n      </StoreKitConfigurationFileReference>\n'
    if has_storekit else ""
)
scheme = f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1600"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "{TARGET_ID}"
               BuildableName = "{PROJECT}.app"
               BlueprintName = "{PROJECT}"
               ReferencedContainer = "container:{PROJECT}.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES">
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
{storekit_xml}      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{TARGET_ID}"
            BuildableName = "{PROJECT}.app"
            BlueprintName = "{PROJECT}"
            ReferencedContainer = "container:{PROJECT}.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{TARGET_ID}"
            BuildableName = "{PROJECT}.app"
            BlueprintName = "{PROJECT}"
            ReferencedContainer = "container:{PROJECT}.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
'''
with open(os.path.join(scheme_dir, f"{PROJECT}.xcscheme"), "w") as fh:
    fh.write(scheme)

print(f"Generated {proj_dir}")
print(f"  {len(sources)} Swift files, {len(resources)} resources, storekit config: {has_storekit}")
