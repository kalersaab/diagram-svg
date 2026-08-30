import { callApi } from '@/app/utils/apiutils';
import { user } from '@/app/utils/endpoints/users';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ApiUser {
  _id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  data: ApiUser;
  message: string;
}

interface UsersResponse {
  data: ApiUser[];
  message: string;
}

interface SingleUserResponse {
  data: ApiUser;
  message: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class UserService {
  /** POST /signup */
  public signup = ({ body }: { body: { email: string; password: string } }) =>
    callApi<AuthResponse>({
      uriEndPoint: user.signup.v1,
      body,
    });

  /** POST /login — sets the HttpOnly Authorization cookie on success */
  public login = ({ body }: { body: { email: string; password: string } }) =>
    callApi<AuthResponse>({
      uriEndPoint: user.login.v1,
      body,
    });

  /** POST /logout — clears the HttpOnly Authorization cookie */
  public logout = () =>
    callApi<{ data: ApiUser; message: string }>({
      uriEndPoint: user.logout.v1,
    });

  /** GET /users */
  public getUsers = () =>
    callApi<UsersResponse>({
      uriEndPoint: user.getUsers.v1,
    });

  /** GET /users/:id */
  public getUserById = ({ pathParams }: { pathParams: { id: string } }) =>
    callApi<SingleUserResponse>({
      uriEndPoint: user.getUserById.v1,
      pathParams,
    });

  /** POST /users */
  public createUser = ({ body }: { body: { email: string; password: string } }) =>
    callApi<SingleUserResponse>({
      uriEndPoint: user.createUser.v1,
      body,
    });

  /** PUT /users/:id */
  public updateUser = ({
    pathParams,
    body,
  }: {
    pathParams: { id: string };
    body: Partial<{ email: string; password: string }>;
  }) =>
    callApi<SingleUserResponse>({
      uriEndPoint: user.updateUser.v1,
      pathParams,
      body,
    });

  /** DELETE /users/:id */
  public deleteUser = ({ pathParams }: { pathParams: { id: string } }) =>
    callApi<SingleUserResponse>({
      uriEndPoint: user.deleteUser.v1,
      pathParams,
    });
}

export default UserService;
