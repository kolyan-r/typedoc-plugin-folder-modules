var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typedoc/dist/lib/converter/components", "typedoc/dist/lib/converter/converter", "typedoc/dist/lib/converter/plugins/CommentPlugin", "typedoc/dist/lib/converter/factories/comment"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const components_1 = require("typedoc/dist/lib/converter/components");
    const converter_1 = require("typedoc/dist/lib/converter/converter");
    const CommentPlugin_1 = require("typedoc/dist/lib/converter/plugins/CommentPlugin");
    const comment_1 = require("typedoc/dist/lib/converter/factories/comment");
    /**
     * This plugin allows you to document your modules by the name of the 'modulefolders'
     * It runs recursively through all your folders and finds every module specified by the 'foldername.module'
     *
     * Based on https://github.com/asgerjensen/typedoc-plugin-external-module-map
     *
     *
     */
    let FolderModulesPlugin = class FolderModulesPlugin extends components_1.ConverterComponent {
        initialize() {
            console.log("INFO: applying regexp to calculate module names");
            this.mapRegEx = new RegExp('([a-z]*.module)', 'gi');
            this.moduleRegEx = new RegExp('([a-z]*.module/index.ts)', 'gi');
            this.isMappingEnabled = true;
            console.log("INFO: Folder Modules Plugin Enabled");
            this.listenTo(this.owner, {
                [converter_1.Converter.EVENT_BEGIN]: this.onBegin,
                [converter_1.Converter.EVENT_CREATE_DECLARATION]: this.onDeclarationBegin,
                [converter_1.Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
            });
        }
        /**
         * Triggered when the converter begins converting a project.
         *
         * @param context  The context object describing the current state the converter is in.
         */
        onBegin(context) {
            this.moduleRenames = [];
        }
        onDeclarationBegin(context, reflection, node) {
            if (!node || !this.isMappingEnabled)
                return;
            var fileName = node.fileName;
            if (fileName == undefined)
                return;
            let match = fileName.match(this.mapRegEx);
            let matchModuleIndex = fileName.match(this.moduleRegEx);
            let preferred = null;
            if (matchModuleIndex) {
                var comment = comment_1.getRawComment(node);
                preferred = true;
            }
            if (null != match) {
                match.forEach(item => {
                    var moduleIndex = item.indexOf('.module');
                    match[match.indexOf(item)] = item.substring(0, moduleIndex);
                });
                console.log(' Mapping ', fileName, ' ==> ', match[match.length - 1]);
                var pParents = match.slice(0, match.length - 1);
                this.moduleRenames.push({
                    renameTo: match[match.length - 1],
                    parents: pParents,
                    preferred: preferred,
                    reflection: reflection
                });
                console.log('Parents');
                console.log(pParents);
            }
            CommentPlugin_1.CommentPlugin.removeTags(reflection.comment, 'preferred');
        }
        /**
         * Triggered when the converter begins resolving a project.
         *
         * @param context  The context object describing the current state the converter is in.
         */
        onBeginResolve(context) {
            let projRefs = context.project.reflections;
            let refsArray = Object.keys(projRefs).reduce((m, k) => { m.push(projRefs[k]); return m; }, []);
            // Process each rename
            this.moduleRenames.forEach(item => {
                let renaming = item.reflection;
                // Find an existing module that already has the "rename to" name.  Use it as the merge target.
                let mergeTarget = refsArray.filter(ref => ref.kind === renaming.kind && ref.name === item.renameTo)[0];
                // If there wasn't a merge target, just change the name of the current module and exit.
                if (!mergeTarget) {
                    renaming.name = item.renameTo;
                    return;
                }
                if (!mergeTarget.children) {
                    mergeTarget.children = [];
                }
                // Since there is a merge target, relocate all the renaming module's children to the mergeTarget.
                let childrenOfRenamed = refsArray.filter(ref => ref.parent === renaming);
                childrenOfRenamed.forEach((ref) => {
                    // update links in both directions
                    ref.parent = mergeTarget;
                    mergeTarget.children.push(ref);
                });
                if (item.preferred)
                    mergeTarget.comment = renaming.comment;
                // Now that all the children have been relocated to the mergeTarget, delete the empty module
                // Make sure the module being renamed doesn't have children, or they will be deleted
                if (renaming.children)
                    renaming.children.length = 0;
                CommentPlugin_1.CommentPlugin.removeReflection(context.project, renaming);
            });
            //Now run through all Renames and change to parents
            console.log('Housekeeping...the parents...');
            let modules = removeDuplicates(this.moduleRenames, 'renameTo');
            modules.forEach(item => {
                console.log(item.renameTo);
                console.log('Parent ', refsArray.filter(ref => ref.kind === item.reflection.kind && ref.name === item.renameTo)[0].parent.name);
            });
            modules.forEach(childitem => {
                let renaming = refsArray.filter(ref => ref.kind === childitem.reflection.kind && ref.name === childitem.renameTo)[0];
                console.log('Module ', renaming.name);
                let desiredParent;
                desiredParent = refsArray.filter(ref => (ref.kind == 1 || ref.kind == 0) && ref.name === childitem.parents[childitem.parents.length - 1])[0];
                if (!desiredParent)
                    return;
                console.log('Desired parent ', desiredParent.name, desiredParent.kind);
                if (!desiredParent.children) {
                    desiredParent.children = [];
                }
                console.log('Changing parent of ', renaming.name);
                console.log('Actual parent ', renaming.parent.name, renaming.parent.kind);
                desiredParent.children.push(renaming);
                renaming.parent = desiredParent;
                if (renaming.parent.kind == 1) {
                    console.log('Parent', renaming.name);
                    console.log('is no parent');
                    context.project.children.splice(context.project.children.indexOf(renaming), 1);
                }
                console.log('Deleted');
            });
        }
    };
    FolderModulesPlugin = __decorate([
        components_1.Component({ name: 'folder-modules' })
    ], FolderModulesPlugin);
    exports.FolderModulesPlugin = FolderModulesPlugin;
    function removeDuplicates(myArr, prop) {
        return myArr.filter((obj, pos, arr) => {
            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
        });
    }
});
