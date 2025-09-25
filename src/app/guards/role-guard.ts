import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Auth } from '../services/auth';

@Injectable({
  providedIn: 'root'
})

export class RoleGuard {

  constructor(private authService: Auth, private router: Router) {}

  canActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const expectedRoles = route.data['roles'] as Array<string>; // Get expected roles from route data

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const userRole = this.authService.getUserRole();

    if (userRole && expectedRoles.includes(userRole)) {
      return true; // User has one of the expected roles, allow access
    } else {
      // User is logged in but doesn't have the required role
      alert('You do not have the necessary permissions to access this page.');
      this.router.navigate(['/home']); // Or a 'forbidden' page
      return false;
    }
  };
}
