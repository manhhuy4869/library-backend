// Shape dữ liệu nằm trong JWT sau khi decode - JwtStrategy.validate() trả về đúng
// interface này, CurrentUser decorator lấy ra dùng ở controller.
export interface JwtPayload {
  sub: number;      // user id
  username: string;
  role: string;
}
