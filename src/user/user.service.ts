import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterDTO } from './register.dto';
import { User } from 'src/types/user';
import { LoginDTO } from 'src/auth/login.dto';
import * as bcrypt from 'bcrypt';
import { Payload } from 'src/types/Payload';


@Injectable()
export class UserService {
    constructor(
        @InjectModel('User') private userModel: Model<User>,
      ) {}

      async create(RegisterDTO: RegisterDTO) {
        const { email,password } = RegisterDTO;
        const user = await this.userModel.findOne({ email });
        if (user) {
          throw new HttpException('user already exists', HttpStatus.BAD_REQUEST);
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const createdUser = new this.userModel({...RegisterDTO,password:hashedPassword});
        await createdUser.save();
        return this.sanitizeUser(createdUser);
      }
      sanitizeUser(user: User) {
        const sanitized = user.toObject();
        delete sanitized['password'];
        return sanitized;
      }
      async findByLogin(UserDTO: LoginDTO) {
        const { email, password } = UserDTO;
        console.log('UserDTO:', UserDTO);
        
        const user = await this.userModel.findOne({ email });
        console.log('User found:', user);        
        
        if (!user) {
          throw new HttpException('User doesn\'t exist', HttpStatus.BAD_REQUEST);
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password match:', isPasswordValid);
        
        if (isPasswordValid) {
          return this.sanitizeUser(user);
        } else {
          throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
        }
      }
      

      async findByPayload(payload: Payload) {
        const { email } = payload;
        return await this.userModel.findOne({ email });
      }
}
