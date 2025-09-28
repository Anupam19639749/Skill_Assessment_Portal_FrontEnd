import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { User } from './user'; // Your UserService
import { AssessmentService } from './assessment-service'; // Your AssessmentService
import { UserAssessment } from './user-assessment'; // Your UserAssessment Service
import { UserAssessments, UserAssessmentStatus } from '../Models/user-assessment.model'; // Your models
import { map } from 'rxjs/operators'; 
import { Users } from '../Models/user.model';
import { Assessment } from '../Models/assessment.model';

@Injectable({
  providedIn: 'root'
})
export class Dashboard {
  constructor(
    private userService: User,
    private assessmentService: AssessmentService,
    private userAssessmentService: UserAssessment
  ) { }

  getAdminStats(): Observable<{ totalUsers: number, totalAssessments: number, totalAssignments: number, totalCompleted: number }> {
    // Use forkJoin to wait for all three API calls to complete
    return forkJoin({
      allUsers: this.userService.getAllUsers(),
      allAssessments: this.assessmentService.getAllAssessments(),
      allUserAssessments: this.userAssessmentService.getAllUserAssessments()
    }).pipe(
      map((data: { allUsers: Users[], allAssessments: Assessment[], allUserAssessments: UserAssessments[] }) => {
        const totalAssignmentsCount = data.allUserAssessments.length;

        const completedCount = data.allUserAssessments.filter(
          (ua: UserAssessments) => ua.status === UserAssessmentStatus.Evaluated || 
                                   ua.status === UserAssessmentStatus.Submitted
        ).length;

        return {
          totalUsers: data.allUsers.length,
          totalAssessments: data.allAssessments.length,
          totalAssignments: totalAssignmentsCount, // NEW STAT
          totalCompleted: completedCount
        };
      })
    );
  }
}
