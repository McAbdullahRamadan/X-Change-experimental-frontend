import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { DashboardComponent } from './components_admin/dashboard/dashboard.component';
import { EditprofileComponent } from './pages/editprofile/editprofile.component';
import { authGuard } from './guards/auth.guard';
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
import { GameXChangeComponent } from './components/game-xchange/game-xchange.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'HowItWorks', component: HowItWorksComponent },

  // مسارات عامة
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'courses', component: CoursesComponent },
  { path: 'Lessons', component: LessonsComponent },
  { path: 'master-skills', component: MasterSkillsComponent },
  { path: 'usercommunity', component: UsercommunityComponent },
  { path: 'about', component: AboutusComponent },
  { path: 'Feed', component: FeedComponent },
  { path: 'EduQuest', component: GameXChangeComponent },






  {path: 'profile/:username',  component: ProfileComponent,canActivate: [authGuard]},
  {path: 'editprofile/:username',component: EditprofileComponent,canActivate: [authGuard]},
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'Dashboard', component: DashboardComponent },
      { path: 'user-management', component: UserMangementComponent },
      { path: 'educator-verification', component: EducatorComponent },
      { path: 'moderation', component: ModerationComponent },
      { path: 'course-management', component: CoureAndContentmanagementComponent },
      { path: 'labor-exchange', component: LaborExchangeComponent },
      { path: 'corporate-partners', component: CorporateManagementComponent },
      { path: 'gamification', component: GmaificationManagementComponent },
      { path: 'audit-logs', component: AuditLogsComponent }
    ]
  },

  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-code', component: VerifyCodeComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  { path: '**', redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
