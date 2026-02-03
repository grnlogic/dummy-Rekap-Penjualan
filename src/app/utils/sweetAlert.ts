import Swal from 'sweetalert2';

export const sweetAlert = {
  // Success Alert
  success: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10B981',
      timer: 3000,
      timerProgressBar: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  },

  // Error Alert
  error: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#EF4444',
      showClass: {
        popup: 'animate__animated animate__shakeX'
      }
    });
  },

  // Warning Alert
  warning: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#F59E0B',
    });
  },

  // Info Alert
  info: (title: string, message?: string) => {
    return Swal.fire({
      title,
      text: message,
      icon: 'info',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3B82F6',
    });
  },

  // Confirmation Dialog
  confirm: (
    title: string,
    text: string,
    confirmButtonText: string = "Ya",
    cancelButtonText: string = "Tidak",
    icon: "warning" | "question" | "info" = "question"
  ) => {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonColor: icon === "warning" ? "#dc2626" : "#3085d6",
      cancelButtonColor: "#6b7280",
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    });
  },

  // Loading Alert
  loading: (title: string, message?: string) => {
    Swal.fire({
      title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#fff',
      customClass: {
        popup: 'rounded-lg shadow-xl',
        title: 'text-lg font-semibold text-gray-800',
        htmlContainer: 'text-gray-600'
      },
      didOpen: () => {
        Swal.showLoading();
        // Custom loading animation
        const loader = Swal.getPopup()?.querySelector('.swal2-loader');
        if (loader) {
          loader.innerHTML = `
            <div class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          `;
        }
      },
    });
  },

  // Close Loading
  close: () => {
    Swal.close();
  },

  // Toast Notifications
  toast: {
    success: (message: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
    },
    error: (message: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: message,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
    },
    warning: (message: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: message,
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
      });
    },
    info: (message: string) => {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    },
  },

  // Custom loading with progress
  progressLoading: (title: string, steps: string[] = []) => {
    let currentStep = 0;
    
    const updateProgress = () => {
      const progress = Math.round(((currentStep + 1) / steps.length) * 100);
      const currentStepText = steps[currentStep] || 'Memproses...';
      
      Swal.update({
        title,
        html: `
          <div class="text-center">
            <div class="mb-4">
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
              </div>
            </div>
            <p class="text-sm text-gray-600">${currentStepText}</p>
            <p class="text-xs text-gray-400 mt-1">${currentStep + 1} dari ${steps.length}</p>
          </div>
        `,
      });
    };

    Swal.fire({
      title,
      html: `
        <div class="text-center">
          <div class="mb-4">
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
          <p class="text-sm text-gray-600">Memulai...</p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    return {
      nextStep: () => {
        currentStep++;
        updateProgress();
      },
      finish: () => {
        Swal.close();
      }
    };
  }
};
