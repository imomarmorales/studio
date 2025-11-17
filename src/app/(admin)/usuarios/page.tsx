'use client';

import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Trophy, User as UserIcon } from 'lucide-react';
import { Participant } from '@/lib/types';

export default function UsuariosPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  
  const usersQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'users'), orderBy('points', 'desc'));
    },
    [firestore, user]
  );
  
  const { data: users, isLoading: loading, error } = useCollection<Participant>(usersQuery);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getUserName = (user: Participant) => {
    return user.name || user.email.split('@')[0];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return 'N/A';
    }
  };

  if (isUserLoading || loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error al cargar usuarios</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Total de usuarios registrados: <Badge variant="secondary">{users?.length || 0}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay usuarios registrados aún.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead className="min-w-[200px]">Usuario</TableHead>
                    <TableHead className="min-w-[250px]">Email</TableHead>
                    <TableHead className="text-center min-w-[100px]">Puntos</TableHead>
                    <TableHead className="min-w-[100px]">Rol</TableHead>
                    <TableHead className="min-w-[150px]">Fecha de Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.photoURL} alt={user.name} />
                            <AvatarFallback>
                              {getInitials(getUserName(user))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getUserName(user)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{user.points || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role || 'usuario'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
