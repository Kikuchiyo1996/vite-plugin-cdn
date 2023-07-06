(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('rollup-plugin-external-globals'), require('fs'), require('path')) :
    typeof define === 'function' && define.amd ? define(['rollup-plugin-external-globals', 'fs', 'path'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["vite-plugin-cdn"] = factory(global.externalGlobals, global.fs, global.path));
})(this, (function (externalGlobals, fs, path) { 'use strict';

    /**
     * get npm module version
     * @param name
     * @returns
     */
    function getModuleVersion(name) {
        const pwd = process.cwd();
        const pkgFile = path.join(pwd, 'node_modules', name, 'package.json');
        if (fs.existsSync(pkgFile)) {
            const pkgJson = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
            return pkgJson.version;
        }
        return '';
    }
    /**
     * 是否完整的 url
     * @param path
     * @returns
     */
    function isFullPath(path) {
        return path.startsWith('http:') ||
            path.startsWith('https:') ||
            path.startsWith('//')
            ? true
            : false;
    }
    function renderUrl(url, data) {
        const { path } = data;
        if (isFullPath(path)) {
            url = path;
        }
        return url
            .replace(/\{name\}/g, data.name)
            .replace(/\{version\}/g, data.version)
            .replace(/\{path\}/g, path);
    }
    function PluginImportToCDN(options) {
        const { modules = [], prodUrl = 'https://cdn.jsdelivr.net/npm/{name}@{version}/{path}', } = options;
        let isBuild = false;
        const data = modules.map(m => {
            let v;
            if (typeof m === 'function') {
                v = m(prodUrl);
            }
            else {
                v = m;
            }
            const version = getModuleVersion(v.name);
            let pathList = [];
            if (!Array.isArray(v.path)) {
                pathList.push(v.path);
            }
            else {
                pathList = v.path;
            }
            const data = Object.assign(Object.assign({}, v), { version });
            pathList = pathList.map(p => {
                if (!version && !isFullPath(p)) {
                    throw new Error(`modules: ${data.name} package.json file does not exist`);
                }
                return renderUrl(prodUrl, Object.assign(Object.assign({}, data), { path: p }));
            });
            let css = v.css || [];
            if (!Array.isArray(css) && css) {
                css = [css];
            }
            const cssList = !Array.isArray(css)
                ? []
                : css.map(c => renderUrl(prodUrl, Object.assign(Object.assign({}, data), { path: c })));
            return Object.assign(Object.assign({}, v), { version,
                pathList,
                cssList });
        });
        const externalMap = {};
        data.forEach(v => {
            externalMap[v.name] = v.var;
        });
        const externalLibs = Object.keys(externalMap);
        const plugins = [
            {
                name: 'vite-plugin-cdn-import',
                config(_, { command }) {
                    const userConfig = {
                        build: {
                            rollupOptions: {},
                        },
                    };
                    if (command === 'build') {
                        isBuild = true;
                        userConfig.build.rollupOptions = {
                            external: [...externalLibs],
                            plugins: [externalGlobals(externalMap)],
                        };
                    }
                    else {
                        isBuild = false;
                    }
                    return userConfig;
                },
                transformIndexHtml(html) {
                    const cssCode = data
                        .map(v => v.cssList
                        .map(css => `<link href="${css}" rel="stylesheet">`)
                        .join('\n'))
                        .filter(v => v)
                        .join('\n');
                    const jsCode = !isBuild
                        ? ''
                        : data.map(p => p.pathList.map(url => {
                            const jsOptions = p.jsOptions
                                ? ` ${p.jsOptions}`
                                : '';
                            return `<script${jsOptions} src="${url}"></script>`;
                        })).join('\n');
                    return html.replace(/<\/title>/i, `</title>${cssCode}\n${jsCode}`);
                },
            },
        ];
        return plugins;
    }

    return PluginImportToCDN;

}));
