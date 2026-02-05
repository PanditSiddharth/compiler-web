  export const codes = {
    javascript: `const readline = require("readline");
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  rl.question("Name: ", name => {
    console.log("Hello", name);
    rl.close();
  });
  `,
  typescript: `interface Student {
  id: number;
  name: string;
  age: number;
  course: string;
}

const student: Student = {
  id: 1,
  name: "Rahul",
  age: 21,
  course: "Computer Science",
};

console.log("Student Details:");
console.log("ID:", student.id);
console.log("Name:", student.name);
console.log("Age:", student.age);
console.log("Course:", student.course);
  `,
    python: `name = input("Enter name: ")
print("Hello", name)
  `,
    bash: 'ls -a',
    java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter name: ");
        String name = scanner.nextLine();
        System.out.println("Hello " + name);
        scanner.close();
    }
}
  `,
    c: `#include <stdio.h>  

int main() {
    char name[100];
    printf("Enter name: ");
    scanf("%s", name);
    printf("Hello %s\\n", name);
    return 0;
}
  `,
    cpp: `#include <iostream>
using namespace std;

int main() {
    string name;
    cout << "Enter name: ";
    cin >> name;
    cout << "Hello " << name << endl;
    return 0;
}
  `,
//     go: `package main

// import "fmt"

// func main() {
//     var name string
//     fmt.Print("Enter name: ")
//     fmt.Scanln(&name)
//     fmt.Println("Hello", name)
// }
//   ` ,
  rust: `use std::io;
use std::io::Write;

fn main() {
    let mut name = String::new();
    print!("Enter name: ");
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut name).expect("Failed to read line");
    println!("Hello {}", name.trim());
}
  `,
  }