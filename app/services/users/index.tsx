import { callApi } from '@/app/utils/apiutils';
import { user } from '@/app/utils/endpoints/users';

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

class UserService {
  
  public signup = ({ body }: { body: { email: string; password: string } }) =>
    callApi<AuthResponse>({
      uriEndPoint: user.signup.v1,
      body,
    });

  public login = ({ body }: { body: { email: string; password: string } }) =>
    callApi<AuthResponse>({
      uriEndPoint: user.login.v1,
      body,
    });

  public logout = () =>
    callApi<{ data: ApiUser; message: string }>({
      uriEndPoint: user.logout.v1,
    });

  public getUsers = () =>
    callApi<UsersResponse>({
      uriEndPoint: user.getUsers.v1,
    });

  public getUserById = ({ pathParams }: { pathParams: { id: string } }) =>
    callApi<SingleUserResponse>({
      uriEndPoint: user.getUserById.v1,
      pathParams,
    });

  public createUser = ({ body }: { body: { email: string; password: string } }) =>
    callApi<SingleUserResponse>({
      uriEndPoint: user.createUser.v1,
      body,
    });

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

  public deleteUser = ({ pathParams }: { pathParams: { id: string } }) =>
    callApi<SingleUserResponse>({
      uriEndPoint: user.deleteUser.v1,
      pathParams,
    });
}

export default UserService;