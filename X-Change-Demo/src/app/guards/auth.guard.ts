import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // التحقق من تسجيل الدخول
  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // التحقق من الصلاحيات إذا كانت مطلوبة
  // const requiredRole = route.data['role'];
  // if (requiredRole) {
  //   const userRole = authService.getUserRole(); // تحتاج لإضافة هذه الدالة
  //   if (userRole !== requiredRole) {
  //     router.navigate(['/unauthorized']);
  //     return false;
  //   }
  // }

  return true;
};
