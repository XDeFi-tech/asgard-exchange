import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PoolComponent } from './pool.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PoolComponent', () => {
  let component: PoolComponent;
  let fixture: ComponentFixture<PoolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PoolComponent ],
      imports: [ HttpClientTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
