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




  {path: 'profile/:username',  component: ProfileComponent,canActivate: [authGuard]},
  {path: 'editprofile/:username',component: EditprofileComponent,canActivate: [authGuard]},
  {path: 'dashboard',component: DashboardComponent,canActivate: [authGuard]},
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
