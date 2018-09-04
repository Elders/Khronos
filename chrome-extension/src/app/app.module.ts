import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AppRoutes } from './app.routing';
import { SidebarModule } from './sidebar/sidebar.module';
import { FooterModule } from './shared/footer/footer.module';
import { NavbarModule } from './shared/navbar/navbar.module';
import { NguiMapModule } from '@ngui/map';

import { DashboardComponent } from './dashboard/dashboard.component';
import { UserComponent } from './user/user.component';
import { SettingsComponent } from './settings/settings.component';
import { TrackingComponent } from './tracking/tracking.component';
import { ProjectsComponent } from './projects/projects.component';
import { TableComponent } from './table/table.component';
import { TypographyComponent } from './typography/typography.component';
import { IconsComponent } from './icons/icons.component';
import { MapsComponent } from './maps/maps.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { UpgradeComponent } from './upgrade/upgrade.component';

import { ChromeStorageService } from './shared/services/chrome-storage.services';
import { JiraService } from './shared/services/jira-tasks.services';


import { ScheduleModule, DialogModule, CalendarModule, ToggleButtonModule, DragDropModule, ButtonModule, InputTextareaModule, CheckboxModule, InputTextModule, SelectButtonModule } from 'primeng/primeng';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    UserComponent,
    SettingsComponent,
    TrackingComponent,
    ProjectsComponent,
    TableComponent,
    TypographyComponent,
    IconsComponent,
    MapsComponent,
    NotificationsComponent,
    UpgradeComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(AppRoutes, { useHash: true }),
    FormsModule,
    SidebarModule,
    NavbarModule,
    FooterModule,
    NguiMapModule.forRoot({ apiUrl: 'https://maps.google.com/maps/api/js?key=YOUR_KEY_HERE' }),
    ScheduleModule,
    HttpClientModule,
    BrowserAnimationsModule,
    DialogModule
  ],
  providers: [ChromeStorageService, JiraService],
  bootstrap: [AppComponent]
})
export class AppModule { }
