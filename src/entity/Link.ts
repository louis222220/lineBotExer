import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {User} from "./User";

@Entity()
export class Link {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(type => User, user => user.links)
    user!: User;

    @Column()
    isRead!: boolean;
    
    @Column()
    linkTitle!: string;
}