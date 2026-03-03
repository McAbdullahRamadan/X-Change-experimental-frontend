import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { HomeComponent } from './components/home/home.component';
import { StepsComponent } from './components/steps/steps.component';
import { SkillsComponent } from './components/skills/skills.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { StatsComponent } from './sections/stats/stats.component';
import { CommunityComponent } from './components/community/community.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './Interceptor/Auth-interceptor';
import { ProfileComponent } from './pages/profile/profile.component';
import { DashboardComponent } from './components_admin/dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    NavbarComponent,
    HeroComponent,
    HowItWorksComponent,
    HomeComponent,
    StepsComponent,
    SkillsComponent,
    TestimonialsComponent,
    StatsComponent,
    CommunityComponent,
    FooterComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,


  ],
  providers: [AuthService,provideHttpClient(withInterceptors([authInterceptor]))],

  bootstrap: [AppComponent]
})
export class AppModule { }
