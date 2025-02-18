import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'src/app/components/ui/button/button.component';
import { FAKE_WORKSPACES, WorkSpace } from 'src/app/models';

@Component({
  selector: 'app-work-space',
  templateUrl: './work-space.component.html',
  styles: [':host { width: 100%; }'],
  imports: [CommonModule, ButtonComponent, TranslateModule],
})
export class WorkSpaceComponent {
  router = inject(Router);

  // TODO: Implement ferching save workspaces
  // public workSpaces: WorkSpace[] = [];
  public workSpaces: WorkSpace[] = FAKE_WORKSPACES;

  createNewWorkSpace() {
    this.router.navigate(['/workspace/new']);
  }
}
