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
import { useAuth, useUser } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().min(1, 'El correo es requerido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

const studentEmailSchema = z.string().email('Por favor, introduce un correo válido.').refine(
    (email) => email.toLowerCase().endsWith('@alumnos.uat.edu.mx'),
    {
      message: 'El correo debe terminar en @alumnos.uat.edu.mx',
    }
);

const registrationSchema = formSchema.extend({
  name: z.string().min(3, 'El nombre es requerido.'),
  email: studentEmailSchema,
});

const loginSchema = formSchema.extend({
    email: z.union([
        z.literal('admin'),
        studentEmailSchema
    ], {
        errorMap: () => ({ message: "Correo inválido o no permitido." })
    })
});


export function LoginForm() {
  const [isRegistering, setIsRegistering] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const { isUserLoading } = useUser();

  const currentSchema = isRegistering ? registrationSchema : loginSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });
  
  // Watch for changes in the isRegistering state to re-validate
  React.useEffect(() => {
    form.trigger();
  }, [isRegistering, form]);


  async function onSubmit(values: z.infer<typeof currentSchema>) {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El servicio de autenticación no está disponible.',
      });
      return;
    }

    // Admin login
    if (values.email.toLowerCase() === 'admin' && values.password === 'admin1') {
      // This is a simple client-side redirect.
      // In a real app, you would handle admin auth securely.
      toast({ title: '¡Bienvenido, Admin!', description: 'Redirigiendo al panel de administración.' });
      router.push('/admin/events');
      return;
    }

    try {
      if (isRegistering) {
        // Registration logic
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;
        const name = (values as z.infer<typeof registrationSchema>).name;

        // Update Firebase Auth profile
        await updateProfile(user, { displayName: name });

        // Create user document in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          id: user.uid,
          name: name,
          email: user.email,
          points: 0,
          digitalCredentialQR: user.uid,
          avatarUrl: `https://picsum.photos/seed/${user.uid}/200`
        });

        toast({
          title: '¡Registro Exitoso!',
          description: 'Hemos creado tu cuenta.',
        });
        router.push('/app/dashboard');
      } else {
        // Login logic
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: '¡Has iniciado sesión!', description: 'Bienvenido de vuelta.' });
        router.push('/app/dashboard');
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
                <Input placeholder="a1234567890@alumnos.uat.edu.mx" {...field} />
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
