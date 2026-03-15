import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { User, UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Photo, PhotoService } from '../../services/photo.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit , OnDestroy {
  @ViewChild('profileInput') profileInput!: ElementRef;
  @ViewChild('coverInput') coverInput!: ElementRef;

  // User data
  userData: User | null = null;
  userId: string | null = null;
  profileUsername: string = '';

  // UI states
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;

  // Image URLs
  profileImageUrl: string = 'default user.png';
  coverImageUrl: string = 'cover.jpg';

  // Photos data
  profilePhotos: Photo[] = [];
  coverPhotos: Photo[] = [];
  currentProfilePhoto: Photo | null = null;
  currentCoverPhoto: Photo | null = null;

  // Hover states
  hoverProfile = false;
  hoverCover = false;

  // Upload states
  uploadingProfile = false;
  uploadingCover = false;
  profileUploadProgress = 0;
  coverUploadProgress = 0;

  // Modal states
  showProfileOptions = false;
  showCoverOptions = false;
  viewingImage = false;
  viewingImageUrl = '';
  viewingImageTitle = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private photoService: PhotoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Subscribe to route params
    const routeSub = this.route.params.subscribe(params => {
      this.profileUsername = params['username'];
      console.log('Profile username from URL:', this.profileUsername);
      this.loadUserProfile();
    });
    this.subscriptions.push(routeSub);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ==================== User Data Loading ====================
  loadUserProfile(): void {
    if (!this.authService.isLoggedIn()) {
      this.error = 'Please login to view profile';
      this.isLoading = false;
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    this.userId = this.authService.getUserIdFromToken();
    console.log('Current user ID from token:', this.userId);

    if (!this.userId) {
      this.error = 'Unable to identify user';
      this.isLoading = false;
      return;
    }

    const userSub = this.userService.getUserById(this.userId).subscribe({
      next: (response: any) => {
        console.log('User data response:', response);

        if (response?.isSuccess && response?.data) {
          this.userData = this.userService.mapUserData(response.data);

          if (this.userData) {
            const expectedUsername = this.userData.userName;
            if (this.profileUsername && expectedUsername &&
                this.profileUsername !== expectedUsername) {
              this.router.navigate([`/profile/${expectedUsername}`]);
              return;
            }
          }

          // ✅ بعد ما نجيب بيانات المستخدم، نجيب الصور
          this.loadUserPhotos();
        } else {
          this.error = 'Failed to load user data';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.handleError(err);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(userSub);
  }

  // ==================== Photo Loading ====================
  loadUserPhotos(): void {
    if (!this.userId) {
      this.isLoading = false;
      return;
    }

    // ✅ التحقق من وجود التوكن
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, cannot load photos');
      this.error = 'Authentication required';
      this.isLoading = false;
      return;
    }

    console.log('Loading user photos for ID:', this.userId);
    console.log('Token exists:', !!token);

    // جلب الصور الشخصية
    const profileSub = this.photoService.getUserPhotos(this.userId, 1).subscribe({
      next: (response) => {
        console.log('Profile photos response:', response);

        if (response?.isSuccess && response?.data) {
          this.profilePhotos = response.data;
          this.currentProfilePhoto = response.data.find((p: Photo) => p.isCurrent) || null;
          if (this.currentProfilePhoto) {
            this.profileImageUrl = this.currentProfilePhoto.photoUrl;
          }
        }
      },
      error: (err) => {
        console.error('Error loading profile photos:', err);
        if (err.status === 401) {
          this.error = 'Session expired. Please login again.';
          this.authService.logout();
          setTimeout(() => this.router.navigate(['/login']), 3000);
        }
      }
    });
    this.subscriptions.push(profileSub);

    // جلب صور الغلاف
    const coverSub = this.photoService.getUserPhotos(this.userId, 2).subscribe({
      next: (response) => {
        console.log('Cover photos response:', response);

        if (response?.isSuccess && response?.data) {
          this.coverPhotos = response.data;
          this.currentCoverPhoto = response.data.find((p: Photo) => p.isCurrent) || null;
          if (this.currentCoverPhoto) {
            this.coverImageUrl = this.currentCoverPhoto.photoUrl;
          }
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading cover photos:', err);
        if (err.status === 401) {
          this.error = 'Session expired. Please login again.';
          this.authService.logout();
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.error = 'Failed to load photos';
        }
        this.isLoading = false;
      }
    });
    this.subscriptions.push(coverSub);
  }

  // ==================== Profile Image Handlers ====================
  openProfileOptions(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileOptions = true;
  }

  closeProfileOptions(): void {
    this.showProfileOptions = false;
  }

  viewCurrentProfileImage(): void {
    if (this.currentProfilePhoto) {
      this.viewingImageUrl = this.currentProfilePhoto.photoUrl;
      this.viewingImageTitle = 'Profile Picture';
      this.viewingImage = true;
    } else {
      this.viewingImageUrl = this.profileImageUrl;
      this.viewingImageTitle = 'Profile Picture';
      this.viewingImage = true;
    }
    this.closeProfileOptions();
  }

  triggerProfileInput(): void {
    this.closeProfileOptions();
    setTimeout(() => this.profileInput.nativeElement.click(), 200);
  }

  onProfileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadProfilePicture(file);
    }
    // Reset input
    event.target.value = '';
  }

  uploadProfilePicture(file: File): void {
    const validation = this.photoService.validateImage(file);
    if (!validation.valid) {
      this.error = validation.message;
      setTimeout(() => this.error = null, 3000);
      return;
    }

    // Preview
    this.photoService.createImagePreview(file).then(preview => {
      this.profileImageUrl = preview;
    });

    this.uploadingProfile = true;
    this.error = null;

    this.photoService.uploadPhoto(file, 1).subscribe({
      next: (response) => {
        console.log('Upload response:', response);

        if (response?.isSuccess && response?.data) {
          // Set as current photo
          this.photoService.setCurrentPhoto(response.data.id, 1).subscribe({
            next: (setResponse) => {
              console.log('Set current response:', setResponse);
              this.currentProfilePhoto = response.data;
              this.profileImageUrl = response.data.photoUrl;
              this.profilePhotos.unshift(response.data);
              this.successMessage = 'Profile picture updated!';
              this.uploadingProfile = false;

              // ✅ إعادة تحميل الصور عشان تتأكد
              this.loadUserPhotos();

              setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
              console.error('Error setting current photo:', err);
              console.error('Error details:', err.error);

              // ✅ حتى لو فشل set current، الصورة اترفعت
              this.profileImageUrl = response.data.photoUrl;
              this.currentProfilePhoto = response.data;
              this.profilePhotos.unshift(response.data);
              this.successMessage = 'Photo uploaded but not set as current';
              this.uploadingProfile = false;

              setTimeout(() => this.successMessage = null, 3000);
            }
          });
        } else {
          this.error = response?.error || 'Failed to upload photo';
          this.uploadingProfile = false;
        }
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.error = err.error?.message || 'Failed to upload photo';
        this.uploadingProfile = false;
      }
    });
  }

  deleteCurrentProfileImage(): void {
    if (!this.currentProfilePhoto) {
      this.error = 'No profile picture to delete';
      return;
    }

    if (confirm('Are you sure you want to delete your profile picture?')) {
      this.photoService.deletePhoto(this.currentProfilePhoto.publicId).subscribe({
        next: (response) => {
          if (response?.isSuccess) {
            this.profileImageUrl = 'default user.png';
            this.profilePhotos = this.profilePhotos.filter(p => p.id !== this.currentProfilePhoto?.id);
            this.currentProfilePhoto = null;
            this.successMessage = 'Profile picture deleted';
            setTimeout(() => this.successMessage = null, 3000);
          } else {
            this.error = response?.error || 'Failed to delete photo';
          }
          this.closeProfileOptions();
        },
        error: (err) => {
          console.error('Error deleting photo:', err);
          this.error = 'Failed to delete photo';
        }
      });
    }
  }


  // ==================== Cover Image Handlers ====================
  openCoverOptions(event: MouseEvent): void {
    event.stopPropagation();
    this.showCoverOptions = true;
  }

  closeCoverOptions(): void {
    this.showCoverOptions = false;
  }

  viewCurrentCoverImage(): void {
    if (this.currentCoverPhoto) {
      this.viewingImageUrl = this.currentCoverPhoto.photoUrl;
      this.viewingImageTitle = 'Cover Picture';
      this.viewingImage = true;
    } else {
      this.viewingImageUrl = this.coverImageUrl;
      this.viewingImageTitle = 'Cover Picture';
      this.viewingImage = true;
    }
    this.closeCoverOptions();
  }

  triggerCoverInput(): void {
    this.closeCoverOptions();
    setTimeout(() => this.coverInput.nativeElement.click(), 200);
  }

  onCoverSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadCoverPicture(file);
    }
    event.target.value = '';
  }

  uploadCoverPicture(file: File): void {
    const validation = this.photoService.validateImage(file);
    if (!validation.valid) {
      this.error = validation.message;
      setTimeout(() => this.error = null, 3000);
      return;
    }

    // Preview
    this.photoService.createImagePreview(file).then(preview => {
      this.coverImageUrl = preview;
    });

    this.uploadingCover = true;
    this.error = null;

    this.photoService.uploadPhoto(file, 2).subscribe({
      next: (response) => {
        console.log('Upload response:', response);

        if (response?.isSuccess && response?.data) {
          // Set as current photo
          this.photoService.setCurrentPhoto(response.data.id, 2).subscribe({
            next: () => {
              this.currentCoverPhoto = response.data;
              this.coverImageUrl = response.data.photoUrl;
              this.coverPhotos.unshift(response.data);
              this.successMessage = 'Cover picture updated!';
              this.uploadingCover = false;

              setTimeout(() => this.successMessage = null, 3000);
            },
            error: (err) => {
              console.error('Error setting current cover:', err);
              this.error = 'Cover uploaded but failed to set as current';
              this.uploadingCover = false;
            }
          });
        } else {
          this.error = response?.error || 'Failed to upload cover';
          this.uploadingCover = false;
        }
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.error = err.error?.message || 'Failed to upload cover';
        this.uploadingCover = false;
      }
    });
  }

  deleteCurrentCoverImage(): void {
    if (!this.currentCoverPhoto) {
      this.error = 'No cover picture to delete';
      return;
    }

    if (confirm('Are you sure you want to delete your cover picture?')) {
      this.photoService.deletePhoto(this.currentCoverPhoto.publicId).subscribe({
        next: (response) => {
          if (response?.isSuccess) {
            this.coverImageUrl = 'cover.jpg';
            this.coverPhotos = this.coverPhotos.filter(p => p.id !== this.currentCoverPhoto?.id);
            this.currentCoverPhoto = null;
            this.successMessage = 'Cover picture deleted';
            setTimeout(() => this.successMessage = null, 3000);
          } else {
            this.error = response?.error || 'Failed to delete cover';
          }
          this.closeCoverOptions();
        },
        error: (err) => {
          console.error('Error deleting cover:', err);
          this.error = 'Failed to delete cover';
        }
      });
    }
  }

  // ==================== Image Viewer ====================
  closeImageViewer(): void {
    this.viewingImage = false;
    this.viewingImageUrl = '';
  }

  // ==================== Photo Gallery ====================
  showAllProfilePhotos(): void {
    // يمكنك فتح معرض لعرض كل الصور
    console.log('Show all profile photos:', this.profilePhotos);
  }

  showAllCoverPhotos(): void {
    // يمكنك فتح معرض لعرض كل صور الغلاف
    console.log('Show all cover photos:', this.coverPhotos);
  }

  // ==================== Navigation ====================
  goToEditProfile(): void {
    if (this.userData?.userName) {
      this.router.navigate(['/editprofile', this.userData.userName]);
    }
  }

  // ==================== Error Handling ====================
  private handleError(err: any): void {
    if (err.status === 401) {
      this.error = 'Session expired. Please login again.';
      this.authService.logout();
      setTimeout(() => this.router.navigate(['/login']), 3000);
    } else if (err.status === 404) {
      this.error = 'User not found';
    } else {
      this.error = 'Failed to load profile. Please try again.';
    }
  }

  // ==================== Utility Methods ====================
  retry(): void {
    this.isLoading = true;
    this.error = null;
    this.loadUserProfile();
  }

  hasUserData(): boolean {
    return !!this.userData && Object.keys(this.userData).length > 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
