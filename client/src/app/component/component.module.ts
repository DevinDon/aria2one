// src/app/component/component.module.ts

import { NgModule } from '@angular/core';
import { MaterialModule } from '../module/material.module';
import { SharedModule } from '../module/shared.module';
import { CustomSnackBarComponent } from './custom-snack-bar/custom-snack-bar.component';
import { AddTaskDialogComponent } from './add-task-dialog/add-task-dialog.component';

@NgModule({
  declarations: [CustomSnackBarComponent, AddTaskDialogComponent],
  imports: [
    SharedModule,
    MaterialModule
  ]
})
export class ComponentModule { }
