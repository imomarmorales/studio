
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInAnonymously } from "firebase/auth";
import { doc } from "firebase/firestore";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const formSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre completo es requerido." }),
  email: z.string().email({ message: "Por favor, ingresa un correo válido." }).refine(email => email.endsWith('@alumnos.uat.edu.mx'), {
    message: "Solo se permiten correos institucionales de alumno (@alumnos.uat.edu.mx)."
  }),
});

export function RegistrationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) return;

    const { fullName, email } = values;

    try {
      // 1. Sign in anonymously to get a new user credential
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // 2. Save user data to Firestore with the new UID
      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        name: fullName,
        email: email,
        id: user.uid,
        points: 0,
        digitalCredentialQR: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${user.uid}`
      };
      
      setDocumentNonBlocking(userDocRef, userData, { merge: true });

      toast({
        title: "¡Bienvenido!",
        description: "Tu registro fue exitoso. Tu sesión ha sido iniciada.",
      });

      // Redirect directly to the dashboard
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error al registrar usuario: ", error);
      let description = "No se pudo completar el registro. Inténtalo de nuevo.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Este correo electrónico ya está en uso. Intenta iniciar sesión."
      }
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: description,
      });
    }
  }


  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Crear una cuenta</CardTitle>
          <CardDescription>
            Regístrate para participar en la Semana de la Ingeniería 2025.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Institucional</FormLabel>
                    <FormControl>
                      <Input placeholder="a2233336160@alumnos.uat.edu.mx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Registrarse
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
           <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="underline text-primary">
              Inicia sesión aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
