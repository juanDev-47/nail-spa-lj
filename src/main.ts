import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './ui/app/app.config';
import { App } from './ui/app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
