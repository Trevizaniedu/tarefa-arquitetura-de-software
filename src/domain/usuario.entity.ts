export type UserRole = 'CLIENTE' | 'BARBEIRO' | 'ADMIN';

export interface UsuarioProps {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  role: UserRole;
}

export class Usuario {
  public id: string;
  public nome: string;
  public email: string;
  public senhaHash: string;
  public role: UserRole;

  constructor(props: UsuarioProps) {
    this.id = props.id;
    this.nome = props.nome;
    this.email = props.email;
    this.senhaHash = props.senhaHash;
    this.role = props.role;
  }
}