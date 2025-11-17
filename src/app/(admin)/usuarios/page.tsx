'use client';

import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Trophy, User as UserIcon } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string; // Fallback por si existe
  points?: number;
  role?: string;
  createdAt?: any;
}

function UsuariosContent() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  
  const usersQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      if (isUserLoading) return null; // Wait for auth to complete
      if (!user) return null; // No user, no query
      return query(collection(firestore, 'users'), orderBy('points', 'desc'));
    },
    [firestore, user, isUserLoading]
  );
  
  const { data: usersData, isLoading: loading, error } = useCollection<User>(usersQuery);
  
  // Filtrar usuarios únicos por email y ordenar por puntos
  const users = usersData ? (() => {
    // Crear un Map para eliminar duplicados por email, manteniendo el que tenga más puntos
    const uniqueUsersMap = new Map<string, typeof usersData[0]>();
    
    usersData.forEach(user => {
      const existing = uniqueUsersMap.get(user.email);
      if (!existing || (user.points || 0) > (existing.points || 0)) {
        uniqueUsersMap.set(user.email, user);
      }
    });
    
    // Convertir a array y ordenar por puntos
    return Array.from(uniqueUsersMap.values()).sort((a, b) => {
      const pointsA = a.points || 0;
      const pointsB = b.points || 0;
      return pointsB - pointsA;
    });
  })() : null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getUserName = (user: User) => {
    return user.name || user.displayName || user.email.split('@')[0];
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
        <div>
          <h1 className="text-3xl font-bold">Usuarios Registrados</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza todos los usuarios del sistema
          </p>
        </div>
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
        <div>
          <h1 className="text-3xl font-bold">Usuarios Registrados</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza todos los usuarios del sistema
          </p>
        </div>
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
    <div className="space-y-6 p-4 sm:p-0">
      <div>
        <h1 className="text-3xl font-bold">Usuarios Registrados</h1>
        <p className="text-muted-foreground">
          Gestiona y visualiza todos los usuarios del sistema
        </p>
      </div>

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

export default function UsuariosPage() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Mobile Header with Menu Trigger */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger className="h-10 w-10 -ml-2" />
          <h1 className="text-lg font-semibold">Usuarios Registrados</h1>
        </header>
        
        <UsuariosContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
