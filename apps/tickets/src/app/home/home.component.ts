import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.config';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  #authService = inject(AuthService);

  get username(): string {
    return this.#authService.username;
  }

  toggleLogin(): void {
    this.username ? this.#authService.logout() : this.#authService.login();
  }
}
