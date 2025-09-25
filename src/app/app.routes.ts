import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth-component/auth-component';
import { Home } from './components/home/home';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';
import { AssessmentManagement } from './components/assessment/assessment-management/assessment-management';
import { QuestionManagement } from './components/assessment/question-management/question-management';
import { UserManagement } from './components/user-management/user-management';
import { AssignAssessment } from './components/assign-assessment/assign-assessment';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component:   AuthComponent },
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
   }
];
