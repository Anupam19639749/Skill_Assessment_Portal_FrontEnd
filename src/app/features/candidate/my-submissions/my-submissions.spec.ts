import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MySubmissions } from './my-submissions';

describe('MySubmissions', () => {
  let component: MySubmissions;
  let fixture: ComponentFixture<MySubmissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MySubmissions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MySubmissions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
