const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  // Bloco de configuração de empacotamento ajustado
  packagerConfig: {
    asar: true,
    // ESSA LINHA DIZ AO FORGE PARA INCLUIR A PASTA DIST INTEIRA DENTRO DO PACOTE FINAL
    extraResource: [
      './dist'
    ],
  },
  rebuildConfig: {},
  makers: [
    // Mantém a geração do arquivo .zip portátil para Windows, Linux e Mac
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'], 
    },
    // Descomentei o instalador padrão do Windows caso você decida gerar o .exe instalador formal futuramente
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: "pdv-face-delivery"
      },
    },
    // Mantém o instalador oficial do Linux Ubuntu/Debian
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1046,              // 1046 = Português (Brasil); 1033 = inglês
        manufacturer: 'Sua Empresa', // troque pelo nome real
        name: 'PDV Face Delivery',   // nome exibido no instalador
        // ui: { chooseDirectory: true }, // opcional: deixa o usuário escolher a pasta
      },
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
