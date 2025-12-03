export type ILoginUser = {
    email: string;
    password: string;
};

export type IRegisterUser = {
    fullName: string;
    email: string;
    password: string;
    role?: 'USER' | 'HOST' | 'ADMIN';
};
