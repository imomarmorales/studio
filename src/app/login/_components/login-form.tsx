'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirebase } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const formSchema = z.object({
  name: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

const studentEmailSchema = z.string().email().refine(
    (email) => email.toLowerCase().endsWith('@alumnos.uat.edu.mx'),
    'El correo debe ser @alumnos.uat.edu.mx'
);

const adminEmailSchema = z.literal('admin@congreso.mx');

const registrationSchema = formSchema.extend({
  name: z.string().min(3, 'El nombre completo es requerido (mínimo 3 caracteres).'),
  lastName: z.string().min(3, 'Los apellidos son requeridos (mínimo 3 caracteres).'),
  email: z.union([studentEmailSchema, adminEmailSchema], {
    errorMap: () => ({ message: "El correo debe ser de @alumnos.uat.edu.mx o admin@congreso.mx" })
  })
});

const loginSchema = formSchema;


export function LoginForm() {
  const [isRegistering, setIsRegistering] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const { isUserLoading } = useUser();
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('');

  const currentSchema = isRegistering ? registrationSchema : loginSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const handlePasswordReset = async () => {
    if (!auth || !resetEmail) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un correo válido.' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: 'Correo Enviado',
        description: 'Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.',
      });
      setIsResettingPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar el correo de restablecimiento. Verifica que el correo sea correcto.',
      });
    }
  };

  async function onSubmit(values: z.infer<typeof currentSchema>) {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El servicio de autenticación no está disponible.',
      });
      return;
    }

    try {
      if (isRegistering) {
        // Registration logic for students or admin
        if (!('name' in values) || !values.name || !('lastName' in values) || !values.lastName) {
            toast({ 
              variant: 'destructive', 
              title: 'Error de Registro', 
              description: 'El nombre completo y apellidos son requeridos.' 
            });
            return;
        }
        
        // Verificar si ya existe un usuario con este email en Firestore
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('email', '==', values.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          toast({
            variant: 'destructive',
            title: 'Email ya registrado',
            description: 'Ya existe una cuenta con este correo. Este usuario ya tiene cuenta registrada.',
          });
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;
        const fullName = `${values.name} ${values.lastName}`;

        // Update Firebase Auth profile
        await updateProfile(user, { displayName: fullName, photoURL: `https://picsum.photos/seed/${user.uid}/200` });
        
        const isAdmin = values.email === 'admin@congreso.mx';

        // Create user document in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          id: user.uid,
          name: fullName,
          email: user.email,
          points: 0,
          role: isAdmin ? 'admin' : 'alumno',
          digitalCredentialQR: user.uid,
          photoURL: `https://picsum.photos/seed/${user.uid}/200`,
          createdAt: new Date(),
          attendanceCount: 0,
          badges: []
        });

        toast({
          title: '¡Registro Exitoso!',
          description: 'Hemos creado tu cuenta. Ahora puedes iniciar sesión.',
        });
        setIsRegistering(false); // Switch to login view
        form.reset();
        
      } else {
        // Login logic
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: '¡Has iniciado sesión!', description: 'Bienvenido de vuelta.' });
        
        if (values.email === 'admin@congreso.mx') {
            router.push('/admin/events');
        } else {
            router.push('/agenda');
        }
      }
    } catch (error: any) {
      console.error(error.code, error.message);
      toast({
        variant: 'destructive',
        title: 'Error de Autenticación',
        description: 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.',
      });
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {isRegistering && (
            <>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  📝 Tu nombre completo es importante
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Será usado para el pase de lista en los eventos del congreso.
                </p>
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre(s) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Carlos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos *</FormLabel>
                    <FormControl>
                      <Input placeholder="García López" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Institucional {isRegistering && '*'}</FormLabel>
                <FormControl>
                  <Input placeholder="a1234567890@alumnos.uat.edu.mx" {...field} />
                </FormControl>
                {isRegistering && (
                  <p className="text-xs text-muted-foreground">
                    Debe ser tu correo institucional @alumnos.uat.edu.mx
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                {isRegistering && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          {!isRegistering && (
            <div className="text-right">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => setIsResettingPassword(true)}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || isUserLoading}
          >
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => {
              setIsRegistering(!isRegistering);
              form.reset();
            }}
          >
            {isRegistering
              ? '¿Ya tienes una cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </Button>
        </form>
      </Form>

      <AlertDialog open={isResettingPassword} onOpenChange={setIsResettingPassword}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              Introduce tu correo electrónico para recibir un enlace de restablecimiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Correo electrónico</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="tu-correo@alumnos.uat.edu.mx"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset}>Enviar Correo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
