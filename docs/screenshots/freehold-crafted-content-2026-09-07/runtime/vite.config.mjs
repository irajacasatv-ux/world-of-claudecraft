import config from '../vite.config.ts';
export default { ...config, server: { ...config.server, port: 5185, host: '127.0.0.1', hmr: false, watch: { ignored: ['**/*'] } } };
