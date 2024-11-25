// Simple toast utility
const toast = {
  success: (message: string) => {
    // You can replace this with a proper toast library like react-toastify
    alert(message);
  },
  error: (message: string) => {
    alert(message);
  }
};

export default toast;
