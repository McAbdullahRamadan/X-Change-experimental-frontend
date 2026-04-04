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

const routes: Routes = [
  { path: '', component: HomeComponent }, // الصفحة الرئيسية
  { path: 'home', redirectTo: '', pathMatch: 'full' }, // إعادة توجيه home إلى الصفحة الرئيسية
  { path: 'HowItWorks', component: HowItWorksComponent },

  // مسارات عامة
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'courses', component: CoursesComponent },
  { path: 'Lessons', component: LessonsComponent },


  // مسارات محمية (تتطلب تسجيل دخول)
  {
    path: 'profile/:username',  // 👈 هنا أضفنا :username
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  {

      path: 'editprofile/:username',
      component: EditprofileComponent,
      canActivate: [authGuard]

  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-code', component: VerifyCodeComponent },
  { path: 'reset-password', component: ResetPasswordComponent },



  // مسار للصفحات غير الموجودة (اختياري)
  { path: '**', redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
