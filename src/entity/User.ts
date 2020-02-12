import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Link} from "./Link";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    lineUserId!: string;

    @OneToMany(type => Link, link => link.user)
    links!: Link[];
}