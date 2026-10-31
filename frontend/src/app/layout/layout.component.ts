import { Component } from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: false,
})
export class LayoutComponent {
  menuItems = [
    { label: 'Jobs', icon: 'pi pi-list', routerLink: '/jobs' },
    { label: 'Downloads', icon: 'pi pi-download', routerLink: '/downloads' },
  ];
}
