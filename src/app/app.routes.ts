import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth-component/auth-component';
import { Home } from './components/home/home';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';
import { AssessmentManagement } from './components/assessment/assessment-management/assessment-management';
import { QuestionManagement } from './components/assessment/question-management/question-management';
import { UserManagement } from './components/user-management/user-management';
import { AssignAssessment } from './components/assign-assessment/assign-assessment';
import { Profile } from './components/profile/profile';
import { TakeAssessment } from './components/candidate/take-assessment/take-assessment';
import { MySubmissions } from './features/candidate/my-submissions/my-submissions';
import { Result } from './features/candidate/result/result';
import { LandingComponent } from './components/landing-component/landing-component';
import { UserAssessmentHistory } from './components/user-assessment-history/user-assessment-history';

export const routes: Routes = [
    { path: '', component: LandingComponent},
    { path: 'login', component:   AuthComponent },
    { path: 'register', component: AuthComponent },
    { path: 'home', component: Home, canActivate: [AuthGuard] },
    {
        path: 'assessments',
        component: AssessmentManagement,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['Admin', 'Evaluator'] }
    },
    {
        path: 'assessments/:assessmentId/questions',
        component: QuestionManagement,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['Admin', 'Evaluator'] }
    },
    {
        path: 'users',
        component: UserManagement,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['Admin'] }
   },
   {
        path: 'assign-assessment',
        component: AssignAssessment,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['Admin', 'Evaluator'] }
   },
   {
        path: 'profile',
        component: Profile,
        canActivate: [AuthGuard]
   },
   {
        path: 'take-assessment/:userAssessmentId',
        component: TakeAssessment,
        canActivate: [AuthGuard]
   },
    {
          path: 'my-submissions',
          component: MySubmissions, 
          canActivate: [AuthGuard]
     },
     {
          path: 'result/:userAssessmentId',
          component: Result,
          canActivate: [AuthGuard]
     },
     {
          path: 'users/:userId/assessments',
          component: UserAssessmentHistory,
          canActivate: [AuthGuard, RoleGuard],
          data: { roles: ['Admin', 'Evaluator'] }
     }
     
];
