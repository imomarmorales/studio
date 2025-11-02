'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ShieldCheck, Star, User } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';

export default function ManageUsersPage() {
  const firestore = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const rolesAdminQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'roles_admin');
  }, [firestore]);

  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);
  const { data: adminRoles, isLoading: isLoadingAdmins } = useCollection(rolesAdminQuery);

  const isLoading = isLoadingUsers || isLoadingAdmins;

  const getRole = (userId: string) => {
    return adminRoles?.some(admin => admin.id === userId) ? 'admin' : 'participant';
  };

  const setAdminRole = (userId: string) => {
    if (!firestore) return;
    const roleDocRef = doc(firestore, 'roles_admin', userId);
    setDocumentNonBlocking(roleDocRef, { uid: userId }, { merge: true });
    toast({
      title: 'Rol actualizado',
      description: 'El usuario ahora es administrador.'
    })
  };
  
  const removeAdminRole = (userId: string) => {
    // Note: This requires a `deleteDocumentNonBlocking` implementation
    // For now, this is a placeholder to show the logic.
    console.log(`Will remove admin role from ${userId}`);
    toast({
      title: 'Función no implementada',
      description: 'La eliminación de roles de administrador se añadirá próximamente.'
    })
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestionar Usuarios"
        description="Ver y administrar todos los participantes registrados."
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className='flex items-center'>
                    <Star className="mr-2 h-4 w-4 text-yellow-500" />
                    {user.points || 0}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRole(user.id) === 'admin' ? 'default' : 'secondary'}>
                     {getRole(user.id) === 'admin' ? <ShieldCheck className="mr-1 h-3 w-3"/> : <User className="mr-1 h-3 w-3"/>}
                    {getRole(user.id)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem>
                        Editar Puntos (Próximamente)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => getRole(user.id) === 'admin' ? removeAdminRole(user.id) : setAdminRole(user.id)}>
                        {getRole(user.id) === 'admin' ? 'Quitar Admin' : 'Hacer Administrador'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Eliminar Usuario (Próximamente)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
