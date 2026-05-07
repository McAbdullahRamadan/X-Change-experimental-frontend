import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { HomeComponent } from './components/home/home.component';
import { StepsComponent } from './components/steps/steps.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { StatsComponent } from './sections/stats/stats.component';

import { FooterComponent } from './components/footer/footer.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './Interceptor/Auth-interceptor';
import { ProfileComponent } from './pages/profile/profile.component';
import { DashboardComponent } from './components_admin/dashboard/dashboard.component';
import {  EditprofileComponent } from './pages/editprofile/editprofile.component';
import { AuthDesignComponent } from './components/auth-design/auth-design.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { VerifyCodeComponent } from './components/verify-code/verify-code.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { CoursesComponent } from './components/courses/courses.component';
import { LessonsComponent } from './components/courses/lessons/lessons.component';
import { MasterSkillsComponent } from './components/courses/master-skills/master-skills.component';
import { UsercommunityComponent } from './components/usercommunity/usercommunity.component';
import { AboutusComponent } from './components/aboutus/aboutus.component';
import { UserMangementComponent } from './components_admin/user-mangement/user-mangement.component';
import { EducatorComponent } from './components_admin/educator/educator.component';
import { ModerationComponent } from './components_admin/moderation/moderation.component';
import { CoureAndContentmanagementComponent } from './components_admin/Course-and-contentmanagement/coure-and-contentmanagement.component';
import { LaborExchangeComponent } from './components_admin/labor-exchange/labor-exchange.component';
import { CorporateManagementComponent } from './components_admin/corporate-management/corporate-management.component';
import { GmaificationManagementComponent } from './components_admin/gmaification-management/gmaification-management.component';
import { AuditLogsComponent } from './components_admin/audit-logs/audit-logs.component';
import { FeedComponent } from './components/feed/feed.component';
import { JoinComponent } from './components/join/join.component';





@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    NavbarComponent,
    HeroComponent,
    HowItWorksComponent,
    HomeComponent,
    StepsComponent,
    TestimonialsComponent,
    StatsComponent,

    FooterComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    EditprofileComponent,
    AuthDesignComponent,
    ForgotPasswordComponent,
    VerifyCodeComponent,
    ResetPasswordComponent,
    CoursesComponent,
    LessonsComponent,
    MasterSkillsComponent,
    UsercommunityComponent,
    AboutusComponent,
    UserMangementComponent,
    EducatorComponent,
    ModerationComponent,
    CoureAndContentmanagementComponent,
    LaborExchangeComponent,
    CorporateManagementComponent,
    GmaificationManagementComponent,
    AuditLogsComponent,
    FeedComponent,
    JoinComponent,



  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      // الإعدادات العامة للتوستر
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
      newestOnTop: true,
      tapToDismiss: false,
      maxOpened: 5,
      autoDismiss: true,
      progressAnimation: 'decreasing',
      titleClass: 'toast-title',
      messageClass: 'toast-message',
      easeTime: 300,
      enableHtml: true,
      toastClass: 'ngx-toastr custom-toast',
    }),
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,




  ],
  providers: [AuthService,provideHttpClient(withInterceptors([authInterceptor]))],

  bootstrap: [AppComponent]
})
export class AppModule { }
