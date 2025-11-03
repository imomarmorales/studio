
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { useAuth } from "@/firebase";
import { Shield } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";

const formSchema = z.object({
  email: z.string().refine(value => {
    const isAdmin = value.toLowerCase() === 'admin';
    const isUatEmail = value.toLowerCase().endsWith('@alumnos.uat.edu.mx') && z.string().email().safeParse(value).success;
    return isAdmin || isUatEmail;
  }, {
    message: "Debe ser 'admin' o un correo institucional válido (@alumnos.uat.edu.mx)."
  }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;

    // Admin login simulation
    if (values.email.toLowerCase() === 'admin') {
      if (values.password === '12345') {
        toast({
          title: "¡Bienvenido, Admin!",
          description: "Has iniciado sesión como administrador.",
        });
        router.push("/admin/events");
        return; // Important: Stop execution here
      }
    }
    
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Inicio de sesión exitoso",
        description: "¡Bienvenido de vuelta!",
      });
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      let errorMessage = "Las credenciales son incorrectas o el usuario no existe. Por favor, regístrate primero.";
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Credenciales inválidas. Por favor, verifica tu correo y contraseña."
      } else if (error.code === 'auth/user-not-found') {
          errorMessage = "El usuario no fue encontrado. Por favor, regístrate primero.";
      }
      
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: errorMessage,
      });
    }
  }

  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl pt-4">Iniciar Sesión</CardTitle>
          <CardDescription>
            Accede a tu cuenta o usa las credenciales de administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo o Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="a22..._@alumnos.uat.edu.mx o admin" {...field} />
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
              <Button type="submit" className="w-full">
                Acceder
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="underline text-primary">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
