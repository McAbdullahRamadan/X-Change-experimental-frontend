import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { DashboardComponent } from './components_admin/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'HowItWorks', component: HowItWorksComponent },
  { path: 'Home', component: HomeComponent },

  { path:'login', component: LoginComponent },
  { path:'register', component: RegisterComponent },
  { path:'profile', component: ProfileComponent },
  { path:'dashboard', component: DashboardComponent },



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
