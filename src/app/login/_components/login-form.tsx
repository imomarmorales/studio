'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, usePathname } from 'next/navigation';

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
import { useAuth, useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import type { Participant } from '@/lib/types';


const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }).or(z.literal('admin')),
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
  name: z.string().min(3, 'El nombre es requerido.'),
  email: z.union([studentEmailSchema, adminEmailSchema], {
    errorMap: () => ({ message: "El correo debe ser de @alumnos.uat.edu.mx" })
  })
});

const loginSchema = formSchema.extend({
    email: z.string().min(1, 'El correo es requerido.').or(z.literal('admin')),
});


export function LoginForm() {
  const [isRegistering, setIsRegistering] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: participant } = useDoc<Participant>(userDocRef);

  const currentSchema = isRegistering ? registrationSchema : loginSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    // Redirect if user is already logged in and we have their role
    if (user && participant) {
        if (participant.role === 'admin') {
            router.push('/admin/users');
        } else {
            router.push('/app/dashboard');
        }
    }
  }, [user, participant, router]);

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
        if (!('name' in values) || !values.name) {
            toast({ variant: 'destructive', title: 'Error de Registro', description: 'El nombre es requerido.' });
            return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;
        const name = values.name;

        // Update Firebase Auth profile
        await updateProfile(user, { displayName: name, photoURL: `https://picsum.photos/seed/${user.uid}/200` });
        
        const isAdmin = values.email === 'admin@congreso.mx';

        // Create user document in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          id: user.uid,
          name: name,
          email: user.email,
          points: 0,
          role: isAdmin ? 'admin' : 'alumno',
          digitalCredentialQR: user.uid,
          photoURL: `https://picsum.photos/seed/${user.uid}/200`
        });

        toast({
          title: '¡Registro Exitoso!',
          description: 'Hemos creado tu cuenta.',
        });
        
      } else {
        // Login logic
        if (values.email === 'admin' && values.password === 'admin1') {
            toast({ title: '¡Has iniciado sesión como Administrador!', description: 'Bienvenido de vuelta.' });
            router.push('/admin/users');
            return;
        }

        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: '¡Has iniciado sesión!', description: 'Bienvenido de vuelta.' });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isRegistering && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input placeholder="a1234567890@alumnos.uat.edu.mx o admin" {...field} />
              </FormControl>
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
              <FormMessage />
            </FormItem>
          )}
        />
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
  );
}
