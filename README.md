## typedoc-plugin-folder-modules

### What

A plugin for [Typedoc](http://typedoc.org)

This plugin allows you to document your modules by the name of the 'modulefolders'.

### The modules are discovered by the tag '.module' of the foldername.


This plugin is thankfully inspired by, and based on, https://github.com/asgerjensen/typedoc-plugin-external-module-map , but does not require a regex. And it runs recursively through all your folders and finds every module specified by the 'foldername.module'


Suppose you have
```
module1.module/index.ts
module1.module/otherfiles.ts
module1.module/module2.module/index.ts
module1.module/module2.module/otherfiles.ts
```

Typedoc will create a tree structure of the modules. The index.ts files are used to document the module of the folder

- module1
- - otherfiles
- - module2
- - - otherfiles


### Installing

Typedoc 0.4 has the ability to discover and load typedoc plugins found in node_modules.
Simply install the plugin and run typedoc.

```
npm install --save -dev typedoc-plugin-folder-modules
./node_modules/typedoc/bin/typedoc
```

### Using
The Plugin will automaticly be attached to typedoc if you install it the way described above
```
./node_modules/typedoc/bin/typedoc --out ./docs  ./src  --mode modules --theme default
```
