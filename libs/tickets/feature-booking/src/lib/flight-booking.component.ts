import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { map, Observable } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';


function injectUserPicStream(): Observable<SafeUrl> {
  const http = inject(HttpClient);
  const sanitizer = inject(DomSanitizer);

  return http.get('https://graph.microsoft.com/v1.0/me/photo/$value', {
      responseType: 'blob',
      headers: { 'Content-Type': 'image/jpeg' },
    }).pipe(
      map(blob => sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob)))
    );
}


@Component({
  selector: 'tickets-flight-booking',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './flight-booking.component.html',
  styles: [`
    .userpic {
      display: ;
      margin: 0 10px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }
  `]
})
export class FlightBookingComponent {
  userPic$ = injectUserPicStream();
}
