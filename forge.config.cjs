const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    // INCLUI A PASTA DIST E A PASTA PRISMA FORA DO ASAR PARA O BACKEND FUNCIONAR EM PRODUÇÃO
    extraResource: [
      './dist',
      './prisma'
    ],
  },
  rebuildConfig: {},
  makers: [
    // Geração do arquivo .zip portátil para Windows, Linux e Mac
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'], 
    },
    // Instalador padrão do Windows (.exe)
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: "pdv-face-delivery"
      },
    },
    // Instalador oficial do Linux Ubuntu/Debian
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    // Gerador oficial do instalador .MSI do Windows
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1046,                    // 1046 = Português (Brasil)
        manufacturer: 'PDV Face Delivery', // Fabricante exibido no Windows
        name: 'PDV Face Delivery',         // Nome exibido no instalador
        ui: { 
          chooseDirectory: true            // Permite ao cliente escolher a pasta de instalação
        }, 
      },
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Ajustado para o formato de declaração padrão de plugins do Electron Forge em CommonJS
    {
      name: '@electron-forge/plugin-fuses',
      config: {
        version: FuseVersion.V1,
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableCookieEncryption]: true,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
      }
    },
  ],
};
