import { Plugin } from 'vite';
import { Options } from './type';
import autoComplete from './autoComplete';
declare function PluginImportToCDN(options: Options): Plugin[];
export { PluginImportToCDN as Plugin, Options, autoComplete };
export default PluginImportToCDN;
