import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:90000,workers:1,
  use:{channel:'chrome',baseURL:'http://127.0.0.1:4179/tomzo-arcade/bowling/',
    viewport:{width:1440,height:1000},
    launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']},
    screenshot:'only-on-failure'},
  webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4179 --strictPort',
    url:'http://127.0.0.1:4179/tomzo-arcade/bowling/',reuseExistingServer:!process.env.CI}
});
