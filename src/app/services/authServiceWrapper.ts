export class AuthServiceWrapper {
  static safeIsAuthenticated(): boolean {
    try {
      const token = localStorage.getItem("authToken");

      if (
        !token ||
        token === "null" ||
        token === "undefined" ||
        token.trim() === ""
      ) {
        return false;
      }

      const { authService } = require("./authService");
      return authService.isAuthenticated();
    } catch (error) {
      this.cleanup();
      return false;
    }
  }

  static cleanup() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
  }
}
