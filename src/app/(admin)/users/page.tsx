'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Participant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';


function UserRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="w-[64px]">
        <Skeleton className="h-12 w-12 rounded-full" />
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-16" />
      </TableCell>
       <TableCell>
        <Skeleton className="h-6 w-16" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
      </TableCell>
    </TableRow>
  );
}

export default function ManageUsersPage() {
  const { firestore } = useFirebase();
  
  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  
  const { data: users, isLoading, error } = useCollection<Participant>(usersQuery);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestionar Usuarios"
        description="Ver y administrar todos los participantes registrados."
      />
      <Card>
        <CardHeader>
          <CardTitle>Lista de Participantes</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Cargando usuarios...'
              : `Se encontraron ${users?.length || 0} participantes.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al Cargar Usuarios</AlertTitle>
              <AlertDescription>
                No se pudieron cargar los datos de los usuarios. Es posible que no tengas los permisos necesarios.
                <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded"><code>{error.message}</code></pre>
              </AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Avatar</TableHead>
                <TableHead>Nombre y Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead className="text-right">ID de Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                </>
              )}
              {!isLoading && !error && users && users.length > 0 && (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                       <Avatar>
                        <AvatarImage src={user.photoURL} alt={user.name} />
                        <AvatarFallback>
                          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                     <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                    </TableCell>
                     <TableCell>
                        {user.points}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

           {!isLoading && !error && (!users || users.length === 0) && (
              <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
                  <div className="bg-muted p-4 rounded-full">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-xl">No hay usuarios registrados</h3>
                  <p className="text-muted-foreground">
                    Aún no se ha registrado ningún participante en el sistema.
                  </p>
              </div>
            )}

        </CardContent>
      </Card>
    </div>
  );
}
