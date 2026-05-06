<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        /* 
            'HR1 Admin',
            'HR2 Admin', 'Trainer', 'Employee',
            'HR3 Admin',
            'HR4 Admin', 'HR4 Manager',
            'LogisticsI Admin', 'Manager', 'Staff',
            'Fleet Manager', 'Driver',
            'Facility Admin', 'Legal Admin', 'Front Desk Admin', 'Super Admin'
        */
        User::factory()->create([
            'name' => 'Ceniza Rei',
            'uuid' => Str::uuid(),
            'email' => 'ceniza082804@gmail.com',
            'password' => '123456',
            'role' => 'HR1 Admin',
        ]);

        User::factory()->create([
            'name' => 'Patrick',
            'uuid' => Str::uuid(),
            'email' => 'patrickpernito1@gmail.com',
            'password' => '123456',
            'role' => 'Administrative Admin',
        ]);

        User::factory()->create([
            'name' => 'Christian',
            'uuid' => Str::uuid(),
            'email' => 'loquezchristian@gmail.com',
            'password' => '123456',
            'role' => 'Fleet Manager',
        ]);

        User::factory()->create([
            'name' => 'Jamiee',
            'uuid' => Str::uuid(),
            'email' => 'jamieeroque20@gmail.com',
            'password' => '123456',
            'role' => 'Fleet Manager',
        ]);

        User::factory()->create([
            'name' => 'Christian',
            'uuid' => Str::uuid(),
            'email' => 'clarkkenthagulo24@gmail.com',
            'password' => '123456',
            'role' => 'Fleet Manager',
        ]);

        User::factory()->create([
            'name' => 'Adriane',
            'uuid' => Str::uuid(),
            'email' => 'adrianea.paracale@gmail.com',
            'password' => '123456',
            'role' => 'Fleet Manager',
        ]);

        User::factory()->create([
            'name' => 'Shaine',
            'uuid' => Str::uuid(),
            'email' => 'pausanoss@gmail.com',
            'password' => '123456',
            'role' => 'Fleet Manager',
        ]);

        User::factory()->create([
            'name' => 'Driver Pipito',
            'uuid' => Str::uuid(),
            'email' => 'driver@gmail.com',
            'password' => '123456',
            'role' => 'Driver',
        ]);

        User::factory()->create([
            'name' => 'Rence Calo',
            'uuid' => Str::uuid(),
            'email' => 'ecnerualolac@gmail.com',
            'password' => '123456',
            'role' => 'LogisticsI Admin',
        ]);

        User::factory()->create([
            'name' => 'Ramos Mark',
            'uuid' => Str::uuid(),
            'email' => 'ramosmark1998@gmail.com',
            'password' => '123456',
            'role' => 'LogisticsI Admin',
        ]);

        User::factory()->create([
            'name' => 'Merbin',
            'uuid' => Str::uuid(),
            'email' => 'nmerbin08@gmail.com',
            'password' => '123456',
            'role' => 'HR2 Admin',
        ]);

        User::factory()->create([
            'name' => 'Andrei SRs',
            'uuid' => Str::uuid(),
            'email' => 'hr3admin@gmail.com',
            'password' => '123456',
            'role' => 'HR3 Admin',
        ]);

        User::factory()->create([
            'name' => 'Ferdinand Tanilon',
            'uuid' => Str::uuid(),
            'email' => 'ferdinandtanilon01@gmail.com',
            'password' => '123456',
            'role' => 'HR4 Admin',
        ]);

        User::factory()->create([
            'name' => 'Jerry',
            'uuid' => Str::uuid(),
            'email' => 'jerryodi7@gmail.com',
            'password' => '123456',
            'role' => 'LogisticsI Admin',
        ]);

        User::factory()->create([
            'name' => 'Edralin',
            'uuid' => Str::uuid(),
            'email' => 'edralinc08@gmail.com',
            'password' => '123456',
            'role' => 'LogisticsI Admin',
        ]);

        User::factory()->create([
            'name' => 'Exekiel',
            'uuid' => Str::uuid(),
            'email' => 'exekielgalitodelapuz@gmail.com',
            'password' => '123456',
            'role' => 'HR4 Manager',
        ]);

        User::factory()->create([
            'name' => 'James Aeroll',
            'uuid' => Str::uuid(),
            'email' => 'jamesaeroll008@gmail.com',
            'password' => '123456',
            'role' => 'CT1 Admin',
        ]);

        User::factory()->create([
            'name' => 'Joshua',
            'uuid' => Str::uuid(),
            'email' => 'acostajoshua352@gmail.com',
            'password' => '123456',
            'role' => 'Tour Operator',
        ]);

        User::factory()->create([
            'name' => 'Brightnee',
            'uuid' => Str::uuid(),
            'email' => 'brightneepadapat@gmail.com',
            'password' => '123456',
            'role' => 'Tour Operator',
        ]);

        User::factory()->create([
            'name' => 'Jampz',
            'uuid' => Str::uuid(),
            'email' => 'jampzdev@gmail.com',
            'password' => '123456',
            'role' => 'CT1 Admin',
        ]);

        User::factory()->create([
            'name' => 'Super Admin',
            'uuid' => Str::uuid(),
            'email' => 'superadmin@gmail.com',
            'password' => '123456',
            'role' => 'Super Admin',
        ]);
    }
}
